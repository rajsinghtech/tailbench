package k8s

import (
	"context"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func DiscoverIngressFQDN(ctx context.Context, cs kubernetes.Interface, labelSelector string) (string, error) {
	ingresses, err := cs.NetworkingV1().Ingresses(Namespace).List(ctx, metav1.ListOptions{LabelSelector: labelSelector})
	if err != nil {
		return "", fmt.Errorf("listing ingresses: %w", err)
	}
	for _, ing := range ingresses.Items {
		for _, lb := range ing.Status.LoadBalancer.Ingress {
			if lb.Hostname != "" {
				return lb.Hostname, nil
			}
			if lb.IP != "" {
				return lb.IP, nil
			}
		}
	}
	return "", fmt.Errorf("no Ingress with label %q has a LoadBalancer hostname in namespace %s", labelSelector, Namespace)
}

func DiscoverPodName(ctx context.Context, cs kubernetes.Interface, labelSelector string) (string, error) {
	pods, err := cs.CoreV1().Pods(Namespace).List(ctx, metav1.ListOptions{LabelSelector: labelSelector})
	if err != nil {
		return "", fmt.Errorf("listing pods: %w", err)
	}
	for _, pod := range pods.Items {
		if pod.Status.Phase == "Running" {
			return pod.Name, nil
		}
	}
	return "", fmt.Errorf("no running pod with label %q found in namespace %s", labelSelector, Namespace)
}

func DiscoverPodIP(ctx context.Context, cs kubernetes.Interface, labelSelector string) (string, error) {
	pods, err := cs.CoreV1().Pods(Namespace).List(ctx, metav1.ListOptions{LabelSelector: labelSelector})
	if err != nil {
		return "", fmt.Errorf("listing pods: %w", err)
	}
	for _, pod := range pods.Items {
		if pod.Status.PodIP != "" && pod.Status.Phase == "Running" {
			return pod.Status.PodIP, nil
		}
	}
	return "", fmt.Errorf("no running pod with label %q found in namespace %s", labelSelector, Namespace)
}

func DiscoverServiceLBFQDN(ctx context.Context, cs kubernetes.Interface, labelSelector string) (string, error) {
	services, err := cs.CoreV1().Services(Namespace).List(ctx, metav1.ListOptions{LabelSelector: labelSelector})
	if err != nil {
		return "", fmt.Errorf("listing services: %w", err)
	}
	for _, svc := range services.Items {
		if svc.Spec.Type != "LoadBalancer" {
			continue
		}
		for _, lb := range svc.Status.LoadBalancer.Ingress {
			if lb.Hostname != "" {
				return lb.Hostname, nil
			}
			if lb.IP != "" {
				return lb.IP, nil
			}
		}
	}
	return "", fmt.Errorf("no Service LB with label %q has a LoadBalancer hostname in namespace %s", labelSelector, Namespace)
}
